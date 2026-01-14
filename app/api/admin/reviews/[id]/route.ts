import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendReviewApprovedEmail } from '@/lib/email/order-emails';

// PATCH /api/admin/reviews/[id] - Update review status (approve/reject)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is admin
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { status } = await request.json();
    const { id } = await context.params;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be approved, rejected, or pending' },
        { status: 400 }
      );
    }

    // Get review details before updating
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        product: {
          select: {
            id: true,
            title: true,
            handle: true
          }
        }
      }
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Update review status
    const updatedReview = await prisma.review.update({
      where: { id },
      data: { status }
    });

    // Send email notification if approved
    if (status === 'approved' && review.user && review.user.email) {
      try {
        await sendReviewApprovedEmail({
          to: review.user.email,
          customerName: review.user.name || 'Customer',
          productTitle: review.product.title,
          productHandle: review.product.handle,
          reviewTitle: review.title || '',
          reviewComment: review.comment || '',
          rating: review.rating
        });
      } catch (emailError) {
        console.error('Failed to send review approved email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      review: updatedReview
    });

  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/reviews/[id] - Delete a review
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is admin
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    // Delete the review (votes will be cascade deleted)
    await prisma.review.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    );
  }
}
